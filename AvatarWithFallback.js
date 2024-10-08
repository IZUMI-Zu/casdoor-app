// Copyright 2024 The Casdoor Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import {Image} from "expo-image";

function AvatarWithFallback({source, fallbackSource, size, style}) {
  const [imageSource, setImageSource] = React.useState(source);

  return (
    <Image
      style={{
        overflow: "hidden",
        borderRadius: 9999,
        width: size,
        height: size,
        ...style,
      }}
      source={imageSource}
      onError={() => setImageSource(fallbackSource)}
      placeholder={fallbackSource}
      placeholderContentFit="cover"
      contentFit="cover"
      transition={300}
      cachePolicy="memory-disk"
    />
  );
}

export default AvatarWithFallback;
